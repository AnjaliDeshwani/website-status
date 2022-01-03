import {
  FC, useState, useEffect, createContext, useRef,
} from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import classNames from '@/components/availability-panel/drag-drop-context/styles.module.scss';
import { dragDropProps } from '@/interfaces/availabilityPanel.type';
import { toast, ToastTypes } from '@/helperFunctions/toast';
import task from '@/interfaces/task.type';
import fetch from '@/helperFunctions/fetch';
import { ASSIGNED } from '@/components/constants/task-status';
import DroppableComponent from './DroppableComponent';

type NotFoundErrorProps = {
  message: string,
};

const { SUCCESS, ERROR } = ToastTypes;

const NotFoundError:FC<NotFoundErrorProps> = ({ message = 'Not found' }) => (
  <div className={classNames.emptyArray}>
    <img src="ghost.png" alt="ghost" />
    <span className={classNames.emptyText}>
      {message}
    </span>
  </div>
);

export const disableDrag = createContext([]);

const DragDropcontext: FC<dragDropProps> = ({
  unAssignedTasks,
  idleMembers,
  refreshData,
}) => {
  const [toogleSearch, setToogleSearch] = useState<boolean>(false);
  const [taskList, setTaskList] = useState<Array<task>>(unAssignedTasks);
  const [memberList, setMemberList] = useState<Array<string>>(idleMembers);
  const [isTaskOnDrag, setIsTaskOnDrag] = useState<boolean>(false);
  const [draggableIds, setDraggableIds] = useState<string[]>([]);

  const ref = useRef([]);

  useEffect(() => {
    setTaskList(unAssignedTasks);
    setMemberList(idleMembers);
  }, [unAssignedTasks, idleMembers]);

  useEffect(() => {
    const newIds = draggableIds.filter((id) => !(id === ref.current[0] || id === ref.current[1]));
    setDraggableIds(newIds);
  }, [ref.current]);
  const reorder = (list:Array<task |string>, startIndex:number, endIndex:number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // eslint-disable-next-line no-async-promise-executor
  const assignTask = (taskId: string, assignee: string) => new Promise(async (resolve) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/tasks/${taskId}`;
      const data = {
        status: ASSIGNED,
        assignee,
      };

      const { requestPromise } = fetch({
        url,
        method: 'patch',
        data,
      });
      await requestPromise;
      toast(SUCCESS, 'Successfully Assigned Task');
    } catch (error:any) {
      if ('response' in error) {
        toast(ERROR, error.response.data.message);
        return;
      }
      toast(ERROR, error.message);
    } finally {
      setTimeout(() => resolve({ id1: taskId, id2: assignee }), 4000);
    }
  });

  const onDragStart = (result:DragEvent | any) => {
    const isTask = result.source.droppableId === 'tasks';
    if (isTask) {
      setIsTaskOnDrag(true);
    } else {
      setIsTaskOnDrag(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.combine && result.destination
      && result.source.droppableId === result.destination.droppableId) {
      const isIdTask = result.source.droppableId === 'tasks';
      const array = isIdTask ? taskList : memberList;
      const items:Array<any> = reorder(
        array,
        result.source.index,
        result.destination.index,
      );
      if (isIdTask) {
        setTaskList(items);
      } else {
        setMemberList(items);
      }
    }

    if (result.combine && result.source.droppableId !== result.combine.droppableId) {
      setDraggableIds([...draggableIds, result.combine.draggableId, result.draggableId]);
      const taskId = result.combine.droppableId === 'tasks'
        ? result.combine.draggableId
        : result.draggableId;
      const assignee = result.combine.droppableId === 'tasks'
        ? result.draggableId
        : result.combine.draggableId;
      const res = await assignTask(taskId, assignee);
      if (res.id1 && res.id2) {
        ref.current = [res.id1, res.id2];
      }
      refreshData();
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <disableDrag.Provider value={draggableIds}>
        <div className={classNames.flexContainer}>
          <div>
            {taskList.length === 0 ? (
              <NotFoundError message="No task found" />
            ) : (
              <div>
                <div className={classNames.searchBoxContainer}>
                  <span
                    onClick={() => {
                      setToogleSearch(!toogleSearch);
                    }}
                    aria-hidden="true"
                    className={classNames.searchText}
                  >
                    Search
                  </span>
                  {toogleSearch && <input />}
                </div>
                <div className={classNames.heading}> </div>
                <DroppableComponent
                  droppableId="tasks"
                  idleMembers={[]}
                  unAssignedTasks={taskList}
                  isTaskOnDrag={isTaskOnDrag}
                />
              </div>
            )}
          </div>
          <div className={classNames.divider} />
          <div>
            {memberList.length === 0 ? (
              <NotFoundError message="No idle members found" />
            ) : (
              <div>
                <div className={classNames.searchBoxContainer}>
                  <span />
                  {toogleSearch && <input />}
                </div>
                <div className={classNames.heading}> </div>
                <div className={classNames.idleMember}>
                  <DroppableComponent
                    droppableId="members"
                    idleMembers={memberList}
                    unAssignedTasks={[]}
                    isTaskOnDrag={isTaskOnDrag}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </disableDrag.Provider>
    </DragDropContext>
  );
};

export default DragDropcontext;
